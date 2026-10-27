import React, {useEffect, useState} from 'react';
import {Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View} from 'react-native';
import {Briefcase, Location, Moneys} from 'iconsax-react-native';
import {
  ButtonComponent,
  ChipComponent,
  InputComponent,
  ScreenHeader,
  StateView,
  TextComponent,
} from '../../components';
import ptApi from '../../apis/ptApi';
import appColors from '../../constants/appColors';
import {fontFamilies} from '../../constants/fontFamilies';
import {SPECIALIZATIONS} from '../../constants/labels';
import {radius, shadow, spacing} from '../../constants/theme';
import {formatCurrency} from '../../utils/format';

// Same limits as the server's PTProfile model.
const MIN_RATE = 10000;
const MAX_RATE = 1000000;
const BIO_MIN = 20;
const BIO_MAX = 500;

const validate = form => {
  const rate = Number(form.hourlyRate);
  return {
    specializations: form.specializations.length === 0 ? 'Chọn ít nhất một chuyên môn' : '',
    experienceYears: form.experienceYears === '' ? 'Nhập số năm kinh nghiệm' : '',
    hourlyRate:
      !form.hourlyRate || rate < MIN_RATE || rate > MAX_RATE
        ? `Giá từ ${formatCurrency(MIN_RATE)} đến ${formatCurrency(MAX_RATE)}`
        : '',
    city: !form.city.trim() ? 'Nhập tỉnh/thành phố' : '',
    district: !form.district.trim() ? 'Nhập quận/huyện' : '',
    bio: form.bio.trim().length < BIO_MIN ? `Giới thiệu cần ít nhất ${BIO_MIN} ký tự` : '',
  };
};

const Section = ({title, subtitle, children}) => (
  <View style={styles.card}>
    <View>
      <TextComponent text={title} size={16} font={fontFamilies.semiBold} />
      {subtitle ? <TextComponent text={subtitle} size={13} color={appColors.textMuted} /> : null}
    </View>
    {children}
  </View>
);

const PTProfileEditScreen = ({navigation}) => {
  const [status, setStatus] = useState('loading');
  const [isNew, setIsNew] = useState(true);
  const [form, setForm] = useState({
    specializations: [],
    experienceYears: '',
    hourlyRate: '',
    city: '',
    district: '',
    bio: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    ptApi
      .getProfile()
      .then(res => {
        const profile = res.data?.data;
        if (profile?._id) {
          setIsNew(false);
          setForm({
            specializations: profile.specializations || [],
            experienceYears: String(profile.experienceYears ?? ''),
            hourlyRate: profile.hourlyRate ? String(profile.hourlyRate) : '',
            city: profile.location?.city || '',
            district: profile.location?.district || '',
            bio: profile.bio || '',
          });
        }
      })
      .catch(() => {})
      .finally(() => setStatus('ready'));
  }, []);

  const errors = validate(form);
  const hasErrors = Object.values(errors).some(Boolean);
  const errorFor = key => (submitted ? errors[key] : '');
  const setField = (key, value) => setForm(prev => ({...prev, [key]: value}));

  const toggleSpec = key =>
    setField(
      'specializations',
      form.specializations.includes(key)
        ? form.specializations.filter(s => s !== key)
        : [...form.specializations, key],
    );

  const save = async () => {
    setSubmitted(true);
    if (hasErrors) {
      return;
    }
    setError('');
    setSaving(true);
    try {
      await ptApi.updateProfile({
        specializations: form.specializations,
        experienceYears: Number(form.experienceYears),
        hourlyRate: Number(form.hourlyRate),
        location: {city: form.city.trim(), district: form.district.trim()},
        bio: form.bio.trim(),
      });
      if (isNew) {
        Alert.alert('Hồ sơ đã sẵn sàng 🎉', 'Học viên giờ đã có thể tìm thấy và đặt lịch với bạn.');
      }
      // When this form is the first screen (new profile) there is nothing to
      // go back to, so move on to the profile instead.
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.replace('PTProfileDisplay');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={isNew ? 'Tạo hồ sơ huấn luyện viên' : 'Sửa hồ sơ huấn luyện viên'}
        onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
      />
      {status === 'loading' ? (
        <StateView type="loading" />
      ) : (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            {isNew ? (
              <View style={styles.intro}>
                <TextComponent
                  text="Hoàn thiện các thông tin dưới đây để xuất hiện trong kết quả tìm kiếm của học viên."
                  size={14}
                  color={appColors.primaryDark}
                />
              </View>
            ) : null}

            <Section title="Chuyên môn" subtitle="Chọn các lĩnh vực bạn có thể hướng dẫn">
              <View style={styles.wrap}>
                {Object.entries(SPECIALIZATIONS).map(([key, label]) => (
                  <ChipComponent
                    key={key}
                    label={label}
                    selected={form.specializations.includes(key)}
                    onPress={() => toggleSpec(key)}
                  />
                ))}
              </View>
              {errorFor('specializations') ? (
                <TextComponent text={errors.specializations} size={12} color={appColors.danger} />
              ) : null}
            </Section>

            <Section title="Kinh nghiệm & giá">
              <InputComponent
                label="Số năm kinh nghiệm"
                value={form.experienceYears}
                onChange={val => setField('experienceYears', val.replace(/[^0-9]/g, '').slice(0, 2))}
                type="number-pad"
                placeholder="VD: 3"
                error={errorFor('experienceYears')}
                prefix={<Briefcase size={20} color={appColors.textMuted} />}
              />
              <InputComponent
                label="Giá mỗi giờ (₫)"
                value={form.hourlyRate}
                onChange={val => setField('hourlyRate', val.replace(/[^0-9]/g, ''))}
                type="number-pad"
                placeholder="VD: 300000"
                helperText={form.hourlyRate ? formatCurrency(form.hourlyRate) : 'Giá hiển thị cho học viên'}
                error={errorFor('hourlyRate')}
                prefix={<Moneys size={20} color={appColors.textMuted} />}
              />
            </Section>

            <Section title="Khu vực dạy">
              <InputComponent
                label="Tỉnh / thành phố"
                value={form.city}
                onChange={val => setField('city', val)}
                placeholder="VD: Hà Nội"
                autoCapitalize="words"
                error={errorFor('city')}
                prefix={<Location size={20} color={appColors.textMuted} />}
              />
              <InputComponent
                label="Quận / huyện"
                value={form.district}
                onChange={val => setField('district', val)}
                placeholder="VD: Cầu Giấy"
                autoCapitalize="words"
                error={errorFor('district')}
                prefix={<Location size={20} color={appColors.textMuted} />}
              />
            </Section>

            <Section title="Giới thiệu" subtitle="Phong cách huấn luyện, thành tích, điều làm bạn khác biệt">
              <InputComponent
                value={form.bio}
                onChange={val => setField('bio', val)}
                placeholder="VD: 5 năm kinh nghiệm giúp học viên giảm mỡ và tăng sức bền..."
                multiline
                maxLength={BIO_MAX}
                autoCapitalize="sentences"
                error={errorFor('bio')}
                helperText={`${form.bio.trim().length}/${BIO_MAX} ký tự (tối thiểu ${BIO_MIN})`}
              />
            </Section>

            {error ? (
              <View style={styles.errorBox}>
                <TextComponent text={error} size={13} color={appColors.danger} />
              </View>
            ) : null}

            <ButtonComponent
              text={isNew ? 'Tạo hồ sơ' : 'Lưu thay đổi'}
              type="primary"
              size="lg"
              onPress={save}
              isLoading={saving}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
};

export default PTProfileEditScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColors.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  intro: {
    backgroundColor: appColors.primarySoft,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  card: {
    backgroundColor: appColors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadow.sm,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  errorBox: {
    backgroundColor: appColors.dangerSoft,
    borderRadius: radius.sm,
    padding: spacing.md,
  },
});
