import { SettingsSectionSkeleton } from "@/components/ui/PageSkeletons";
import { PushDeviceToggle } from "@/features/push/components/PushDeviceToggle";
import { PushPreferencesList } from "@/features/push/components/PushPreferencesList";
import { usePushConfig } from "@/features/push/hooks/usePush";

export const SettingsNotificationsSection = () => {
  const configQuery = usePushConfig();
  const config = configQuery.data;

  return (
    <section>
      <h2 className="display-4 text-foreground">Notifications</h2>
      <p className="body-s mt-1 text-muted-foreground">
        The bell always shows every notification. Push also sends them to your devices, even with Interis closed.
      </p>

      <div className="mt-4 space-y-6">
        {configQuery.isPending ? (
          <SettingsSectionSkeleton label="Loading notification settings" />
        ) : config?.enabled && config.publicKey ? (
          <>
            <PushDeviceToggle publicKey={config.publicKey} />
            <PushPreferencesList />
          </>
        ) : (
          <p className="body-s text-muted-foreground">Push notifications aren't available right now.</p>
        )}
      </div>
    </section>
  );
};
